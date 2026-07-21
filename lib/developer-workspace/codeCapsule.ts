import { createHash, randomUUID } from "node:crypto";

import type { CompletenessContract } from "./completenessContract";

export type CodeCapsuleState =
  | "draft"
  | "incomplete"
  | "waiting-validation"
  | "validated"
  | "active"
  | "deprecated"
  | "archived"
  | "deleted";

export type CodeCapsuleRequirementKind = "text" | "symbol" | "import" | "export";

export type CodeCapsuleRequirement = {
  id: string;
  kind: CodeCapsuleRequirementKind;
  value: string;
  description: string;
};

export type CodeCapsuleFragment = {
  id: string;
  order: number;
  content: string;
  note: string;
  createdAt: string;
};

export type CodeCapsuleTransition = {
  id: string;
  from: CodeCapsuleState | null;
  to: CodeCapsuleState;
  occurredAt: string;
  reason: string;
  actor: "developer" | "validator" | "activator" | "system";
};

export type CodeCapsuleValidation = {
  candidateHash: string;
  targetFileHash: string;
  validatedAt: string;
  syntaxPassed: boolean;
  requirementsPassed: boolean;
  importAcceptancePassed?: boolean;
  completenessPassed?: boolean;
  projectTypecheckPassed: boolean;
  diagnostics: string[];
  confirmationTokenHash: string | null;
  confirmationExpiresAt: string | null;
};

export type CodeCapsule = {
  id: string;
  version: number;
  title: string;
  description: string;
  state: CodeCapsuleState;
  target: {
    file: string;
    startLine: number;
    endLine: number;
    expectedLines: string[];
  };
  requirements: CodeCapsuleRequirement[];
  completenessContract: CompletenessContract | null;
  fragments: CodeCapsuleFragment[];
  transitions: CodeCapsuleTransition[];
  validation: CodeCapsuleValidation | null;
  preventionAttemptId: string | null;
  createdAt: string;
  updatedAt: string;
  activatedAt: string | null;
};

export type CreateCodeCapsuleInput = Pick<CodeCapsule, "title" | "description" | "target" | "requirements"> & {
  completenessContract?: CompletenessContract | null;
};

const allowedTransitions: Record<CodeCapsuleState, ReadonlySet<CodeCapsuleState>> = {
  draft: new Set(["incomplete", "deleted"]),
  incomplete: new Set(["waiting-validation", "deleted"]),
  "waiting-validation": new Set(["validated", "incomplete", "deleted"]),
  validated: new Set(["active", "incomplete", "deleted"]),
  active: new Set(["deprecated", "archived"]),
  deprecated: new Set(["active", "archived"]),
  archived: new Set(["active", "deleted"]),
  deleted: new Set(["draft"]),
};

function cleanLines(lines: string[]): string[] {
  if (!Array.isArray(lines) || !lines.every((line) => typeof line === "string")) {
    throw new Error("Capsule target lines must be strings.");
  }
  return [...lines];
}

function validateInput(input: CreateCodeCapsuleInput): void {
  if (!input.title.trim()) throw new Error("Capsule title is required.");
  if (!input.target.file.trim() || input.target.file.includes("..")) {
    throw new Error("Capsule target must be a project-relative file.");
  }
  if (
    !Number.isInteger(input.target.startLine) ||
    !Number.isInteger(input.target.endLine) ||
    input.target.startLine < 1 ||
    input.target.endLine < input.target.startLine
  ) {
    throw new Error("Capsule target line range is invalid.");
  }
  if (input.target.expectedLines.length !== input.target.endLine - input.target.startLine + 1) {
    throw new Error("Capsule expected lines must exactly match its target range.");
  }
  if (input.requirements.some((requirement) => !requirement.id || !requirement.value.trim())) {
    throw new Error("Every capsule requirement needs an id and value.");
  }
}

function transitionEntry(
  from: CodeCapsuleState | null,
  to: CodeCapsuleState,
  occurredAt: string,
  reason: string,
  actor: CodeCapsuleTransition["actor"]
): CodeCapsuleTransition {
  return { id: randomUUID(), from, to, occurredAt, reason, actor };
}

export function createCodeCapsule(
  input: CreateCodeCapsuleInput,
  occurredAt = new Date().toISOString(),
  id: string = randomUUID()
): CodeCapsule {
  validateInput(input);
  return {
    id,
    version: 1,
    title: input.title.trim(),
    description: input.description.trim(),
    state: "draft",
    target: { ...input.target, file: input.target.file.replaceAll("\\", "/"), expectedLines: cleanLines(input.target.expectedLines) },
    requirements: input.requirements.map((requirement) => ({ ...requirement })),
    completenessContract: input.completenessContract
      ? JSON.parse(JSON.stringify(input.completenessContract)) as CompletenessContract
      : null,
    fragments: [],
    transitions: [transitionEntry(null, "draft", occurredAt, "Code capsule created outside the active source tree.", "developer")],
    validation: null,
    preventionAttemptId: null,
    createdAt: occurredAt,
    updatedAt: occurredAt,
    activatedAt: null,
  };
}

export function transitionCodeCapsule(
  capsule: CodeCapsule,
  to: CodeCapsuleState,
  reason: string,
  actor: CodeCapsuleTransition["actor"],
  occurredAt = new Date().toISOString()
): CodeCapsule {
  if (capsule.state === to) return capsule;
  if (!allowedTransitions[capsule.state].has(to)) {
    throw new Error(`Code capsule cannot transition from ${capsule.state} to ${to}.`);
  }
  if (!reason.trim()) throw new Error("Lifecycle transition reason is required.");
  return {
    ...capsule,
    version: capsule.version + 1,
    state: to,
    validation: to === "validated" || to === "active" ? capsule.validation : null,
    updatedAt: occurredAt,
    activatedAt: to === "active" ? occurredAt : capsule.activatedAt,
    transitions: [...capsule.transitions, transitionEntry(capsule.state, to, occurredAt, reason.trim(), actor)],
  };
}

export function appendCodeCapsuleFragment(
  capsule: CodeCapsule,
  content: string,
  note = "",
  occurredAt = new Date().toISOString(),
  id: string = randomUUID()
): CodeCapsule {
  if (["active", "deprecated", "archived", "deleted"].includes(capsule.state)) {
    throw new Error(`Fragments cannot be added while a capsule is ${capsule.state}.`);
  }
  if (!content.trim()) throw new Error("Capsule fragment content is required.");
  const fragment: CodeCapsuleFragment = {
    id,
    order: capsule.fragments.length,
    content,
    note: note.trim(),
    createdAt: occurredAt,
  };
  const withFragment: CodeCapsule = {
    ...capsule,
    version: capsule.version + 1,
    fragments: [...capsule.fragments, fragment],
    validation: null,
    updatedAt: occurredAt,
  };
  return capsule.state === "draft"
    ? transitionCodeCapsule(withFragment, "incomplete", "The first inactive code fragment was added.", "system", occurredAt)
    : withFragment;
}

export function assembledCodeCapsuleText(capsule: CodeCapsule): string {
  return [...capsule.fragments]
    .sort((left, right) => left.order - right.order || left.createdAt.localeCompare(right.createdAt))
    .map((fragment) => fragment.content)
    .join("\n");
}

export function codeCapsuleCandidateHash(capsule: CodeCapsule): string {
  return createHash("sha256").update(assembledCodeCapsuleText(capsule)).digest("hex");
}
